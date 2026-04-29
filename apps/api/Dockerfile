FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3001

CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:3001", "--workers", "2", "--threads", "4", "--timeout", "120"]
