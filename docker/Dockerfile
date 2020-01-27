# to make a smaller image, replace FROM line by following line
# FROM node:12-alpine as builder
FROM node:12-buster-slim as builder
WORKDIR /build
COPY ["package*.json", "./"]
# COPY [".npmrc", "package*.json", "./"]
RUN npm install --production

# to make a smaller image, replace FROM line by following 2 lines
# FROM node:12-alpine
# RUN apk add bash
FROM node:12-buster-slim
WORKDIR /app
COPY --from=builder /build .
COPY . .
COPY wait-for-it.sh /usr/local/bin/
CMD [ "npm", "start" ]
