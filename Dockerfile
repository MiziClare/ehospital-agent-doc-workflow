# Use lightweight Python base image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Copy dependency file first
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all project files
COPY . .

# Expose port (FastAPI default 8000)
EXPOSE 8000

# Startup command (If your entry file is main.py)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
