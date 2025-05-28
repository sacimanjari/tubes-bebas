FROM nginx:alpine

# Copy nginx.conf dari folder config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static content dari folder static
COPY static/ /usr/share/nginx/html/

# Set permissions
RUN chmod 644 /etc/nginx/conf.d/default.conf && \
    chmod -R 755 /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 