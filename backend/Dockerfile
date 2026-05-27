FROM python:3.11-slim

# Dependencias del sistema + fuentes necesarias para cairosvg
RUN apt-get update && apt-get install -y \
    libcairo2-dev \
    libffi-dev \
    pkg-config \
    fontconfig \
    wget \
    fonts-liberation \
    fonts-dejavu-core \
    fonts-noto \
    && rm -rf /var/lib/apt/lists/*

# Instalar Outfit y Onest desde Google Fonts GitHub releases
RUN mkdir -p /usr/local/share/fonts/custom && \
    wget -q "https://github.com/Outfitio/Outfit-Font/releases/download/1.1/Outfit.zip" \
         -O /tmp/Outfit.zip && \
    apt-get install -y unzip && \
    unzip -q /tmp/Outfit.zip -d /tmp/Outfit && \
    find /tmp/Outfit -name "*.ttf" -exec cp {} /usr/local/share/fonts/custom/ \; && \
    rm -rf /tmp/Outfit /tmp/Outfit.zip && \
    wget -q "https://fonts.google.com/download?family=Onest" \
         -O /tmp/Onest.zip && \
    unzip -q /tmp/Onest.zip -d /tmp/Onest && \
    find /tmp/Onest -name "*.ttf" -exec cp {} /usr/local/share/fonts/custom/ \; && \
    rm -rf /tmp/Onest /tmp/Onest.zip && \
    fc-cache -f /usr/local/share/fonts/custom && \
    apt-get remove -y unzip && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5050
CMD ["python", "app.py"]
