FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libffi-dev \
    pkg-config \
    fontconfig \
    wget \
    fonts-liberation \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

# Instalar Outfit y Onest desde raw.githubusercontent.com (sin redirect)
RUN mkdir -p /usr/local/share/fonts/custom && \
    wget -q "https://raw.githubusercontent.com/google/fonts/main/ofl/outfit/Outfit%5Bwght%5D.ttf" \
         -O /usr/local/share/fonts/custom/Outfit.ttf && \
    wget -q "https://raw.githubusercontent.com/google/fonts/main/ofl/onest/Onest%5Bwght%5D.ttf" \
         -O /usr/local/share/fonts/custom/Onest.ttf && \
    fc-cache -f /usr/local/share/fonts/custom

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5050
CMD ["python", "app.py"]
