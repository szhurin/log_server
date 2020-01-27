FROM node:12-alpine as builder
WORKDIR /build
COPY ["package*.json", "./"]
# COPY [".npmrc", "package*.json", "./"]
RUN npm install

FROM node:12-alpine
WORKDIR /app
COPY --from=builder /build .
COPY . .
CMD [ "npm", "run", "test" ]
