import json
import httpx
import logging
import asyncio
from typing import AsyncGenerator, List, Dict
from ..config.config import settings

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("GrokService")

class GrokService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        # Groq's OpenAI-compatible endpoint
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"
        # Best available Groq model for chat (fast + smart)
        self.model = "llama-3.3-70b-versatile"
        self.timeout = 30.0
        self.max_retries = 2

    async def generate_stream(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """
        Sends chat history to Groq and yields response chunks.
        Falls back to local mock response if GROQ_API_KEY is not defined or unavailable.
        """
        if not self.api_key or self.api_key.strip() == "":
            logger.warning("GROQ_API_KEY not set. Falling back to simulated response stream.")
            async for chunk in self._generate_simulated_stream(messages):
                yield chunk
            return

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": True,
            "temperature": 0.7,
            "max_tokens": 1024,
        }

        retries = 0
        backoff = 1.0

        while retries <= self.max_retries:
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    async with client.stream("POST", self.api_url, headers=headers, json=payload) as response:
                        # Read full body for proper error reporting on non-200
                        if response.status_code == 401:
                            body = await response.aread()
                            logger.error(f"Groq Auth Error (401): {body.decode()}")
                            yield "Invalid Groq API key. Please check GROQ_API_KEY in the .env file."
                            return
                        elif response.status_code == 429:
                            body = await response.aread()
                            logger.error(f"Groq Rate Limit (429): {body.decode()}")
                            yield "Groq rate limit reached. Please wait a moment and try again."
                            return
                        elif response.status_code == 400:
                            body = await response.aread()
                            logger.error(f"Groq Bad Request (400): {body.decode()}")
                            yield f"Bad request to Groq API: {body.decode()}"
                            return
                        elif response.status_code >= 500:
                            body = await response.aread()
                            logger.error(f"Groq Server Error ({response.status_code}): {body.decode()}")
                            raise httpx.HTTPStatusError(
                                f"Groq server error {response.status_code}: {body.decode()}",
                                request=response.request,
                                response=response
                            )
                        
                        response.raise_for_status()
                        
                        async for line in response.aiter_lines():
                            if not line.strip():
                                continue
                            if line.startswith("data: "):
                                data_str = line[6:].strip()
                                if data_str == "[DONE]":
                                    break
                                try:
                                    data_json = json.loads(data_str)
                                    choice = data_json.get("choices", [{}])[0]
                                    delta = choice.get("delta", {})
                                    content = delta.get("content", "")
                                    if content:
                                        yield content
                                except json.JSONDecodeError:
                                    logger.error(f"Error parsing JSON from stream line: {line}")
                        return  # Successfully completed stream
            except (httpx.HTTPError, asyncio.TimeoutError) as e:
                retries += 1
                if retries > self.max_retries:
                    logger.error(f"Groq API call failed after {self.max_retries} retries: {e}")
                    logger.warning("Falling back to simulated response stream after Groq connection failure.")
                    async for chunk in self._generate_simulated_stream(messages):
                        yield chunk
                    break
                logger.warning(f"Groq API retry {retries}/{self.max_retries} after error: {e}. Backing off {backoff}s...")
                await asyncio.sleep(backoff)
                backoff *= 2.0

    async def _generate_simulated_stream(self, messages: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """
        Simulated streaming responses when no Grok API Key is provided.
        """
        last_user_message = messages[-1]["content"].lower() if messages else ""
        
        # Craft responses depending on the query keywords
        if "crowd" in last_user_message or "density" in last_user_message:
            text = (
                "According to our live telemetry, Sector B (East Stand) is currently at 97% crowd density. "
                "Staff members have already been dispatched to deploy temporary guide lanes at Gate 4 to ease "
                "egress flow. The neighboring Sector A (North Stand) is sitting at 91% capacity. "
                "Would you like me to push real-time digital signage updates to reroute incoming spectators?"
            )
        elif "evacuation" in last_user_message or "emergency" in last_user_message:
            text = (
                "Emergency protocol status: Evacuation pathways are fully operational. "
                "Main egress gates 1, 3, 7, and 9 are cleared with zero obstructions. "
                "In the event of an escalation, AI Transport integration will prioritize Metro Lines 1 and 3 "
                "and deploy all stand-by shuttle buses to parking zone P4 immediately. "
                "Please confirm if you want to broadcast this evacuation drill alert to the operations team."
            )
        elif "metro" in last_user_message or "transport" in last_user_message:
            text = (
                "Transport System Update:\n"
                "- **Metro Line 1**: Nominal operations (68% capacity).\n"
                "- **Metro Line 3**: High Load (94% capacity). Rerouting shuttle buses to absorb overflow.\n"
                "- **Bus Shuttles**: 100% active, routing between parking P4 and South Gate.\n"
                "I have requested the local transport authority to inject 2 extra trains onto Line 3 in 15 minutes."
            )
        else:
            text = (
                "Welcome to the StadiumMind AI Command Center. I am analyzing the live FIFA World Cup 2026 "
                "stadium operations data. Currently, attendance is at 89,234 (93.9% capacity). "
                "No critical security alarms are active, and food concession stands are running at nominal flow. "
                "What stadium parameters would you like me to inspect next?"
            )
            
        # Yield word-by-word with delay to simulate streaming
        words = text.split(" ")
        for i, word in enumerate(words):
            yield (word + " ")
            await asyncio.sleep(0.04)
