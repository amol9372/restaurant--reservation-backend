docker run -d \
-p 27017:27017 \
--name mongo-waitlist \
--net mongo-cluster \
-v ./init-mongo.js:/docker-entrypoint-initdb.d/init-mongo.js \
mongo mongod --replSet rs0
