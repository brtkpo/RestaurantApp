FROM node:18-alpine

WORKDIR /app/frontend/

COPY package*.json /app/frontend/
RUN npm install
RUN npm i react-scripts

COPY . /app/frontend/

CMD ["npm", "start"]




