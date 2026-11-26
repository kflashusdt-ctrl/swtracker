# Use a PHP image that includes Node.js
FROM php:8.2-cli

# Install Node.js (needed to build the React app)
RUN apt-get update && apt-get install -y nodejs npm

# Set the working directory
WORKDIR /app

# Copy all files
COPY . .

# Build the React app and copy the API into the dist folder
RUN npm install && npm run build:render

# Expose the port Render uses
EXPOSE 8000

# Start the PHP server using the router we created
CMD ["php", "-S", "0.0.0.0:8000", "router.php"]