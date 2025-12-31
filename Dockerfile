
FROM node:18-alpine

# Install Python
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

COPY package.json .
RUN npm install

COPY runner.js .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "runner.js"]
