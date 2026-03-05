FROM python:3.12-slim

WORKDIR /app

# Install CPU-only torch first to prevent sentence-transformers from pulling CUDA (~2 GB)
RUN pip install --no-cache-dir torch==2.5.1+cpu --extra-index-url https://download.pytorch.org/whl/cpu

# Install remaining Python dependencies
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY deploy/ ./deploy/

WORKDIR /app/backend

EXPOSE 8000
CMD python -m uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
