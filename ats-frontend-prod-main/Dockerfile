FROM node:14


# Set the working directory within the container
WORKDIR  /app



# Copy package.json and package-lock.json to the container
COPY package*.json ./


RUN npm install




COPY . .


RUN npm run build




EXPOSE 3000


CMD ["npm", "start"]
