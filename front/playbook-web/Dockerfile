FROM node:22-alpine

WORKDIR /app

COPY package.json yarn.lock .yarnrc.yml ./

RUN corepack enable
RUN yarn install --immutable
COPY . .

ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

RUN yarn build

EXPOSE 3000

CMD ["yarn", "start"]
