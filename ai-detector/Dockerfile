FROM python:3.10-slim

WORKDIR /app

# Copy requirements.txt first to leverage Docker layer caching
COPY requirements.txt .

# Install dependencies and cache them
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

VOLUME /app/models

CMD ["python", "src/main.py"]