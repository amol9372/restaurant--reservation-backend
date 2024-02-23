# Use the official MongoDB image as the base image
FROM mongo

# Set environment variables for MongoDB
# ENV MONGO_INITDB_ROOT_USERNAME mongouser
# ENV MONGO_INITDB_ROOT_PASSWORD avizva9372

# Copy the script to initialize a new database and collection
COPY init-mongo.js /docker-entrypoint-initdb.d/
# COPY mongodb-keyfile /etc/mongo/mongodb-keyfile
# Expose port 27017
EXPOSE 27017