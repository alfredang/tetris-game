FROM nginx:alpine
WORKDIR /usr/share/nginx/html
COPY index.html script.js style.css .
EXPOSE 80
