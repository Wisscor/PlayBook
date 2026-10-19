FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./

RUN corepack enable
RUN yarn install

COPY . .

EXPOSE 3000

CMD ["yarn", "dev", "--hostname", "0.0.0.0"]
