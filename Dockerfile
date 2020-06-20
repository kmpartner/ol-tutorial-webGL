FROM nginx:alpine
COPY /build /usr/share/nginx/html
EXPOSE 80
# CMD ["/usr/sbin/nginx"]
# CMD [“nginx”, “-g”, “daemon off;”]
