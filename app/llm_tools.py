import json
from typing import Dict, Any
from openai import OpenAI
from app.config import settings


client = OpenAI(api_key=settings.openai_api_key)


# ------- 你的真实 Workflow 工具函数们 --------

def get_weather(city: str) -> str:
    """假天气服务，用于 Workflow Demo"""
    return f"[Workflow result] Weather in {city}: Sunny 20°C ☀"


FUNCTION_REGISTRY = {
    "get_weather": get_weather,
}


# ------- 工具规范（模型用来判断调用哪个函数） --------

TOOLS_SPEC = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Return weather info for a city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string"}
                },
                "required": ["city"],
            },
        },
    }
]


# ------- Workflow 调度函数：只返回 tool_call，不生成自然语言 --------

def llm_route_to_tool(user_query: str) -> Dict[str, Any]:
    """
    第一次模型推理：
    只用于决定调用哪个工具（不生成自然语言）。
    """
    messages = [
        {
            "role": "system",
            "content": (
                "You are a workflow orchestrator. "
                "You MUST call one of the available tools. "
                "Do NOT respond in natural language."
            ),
        },
        {"role": "user", "content": user_query},
    ]

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=messages,
        tools=TOOLS_SPEC,
        tool_choice="required",  # ★ 强制只输出 function_call
    )

    msg = response.choices[0].message

    if not msg.tool_calls:
        raise ValueError("Model did not output a tool call")

    tc = msg.tool_calls[0]
    func_name = tc.function.name
    args = json.loads(tc.function.arguments)

    return {
        "function_name": func_name,
        "arguments": args,
    }


def execute_tool(func_name: str, arguments: Dict[str, Any]) -> Any:
    """真正执行 Python 函数（workflow 步骤）"""
    func = FUNCTION_REGISTRY.get(func_name)
    if not func:
        raise ValueError(f"Unknown function: {func_name}")
    return func(**arguments)
