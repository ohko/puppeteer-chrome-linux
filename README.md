# docker
```
docker rm -fv puppeteer
docker pull ohko/puppeteer-chrome-linux
docker run --name=puppeteer --restart=always -p 8080:8080 ohko/puppeteer-chrome-linux
```

# install
```
npm install
```

# test cli
```
npm run test
# or
node test.js
```

# run server
```
npm run start
# or
node server.js
```