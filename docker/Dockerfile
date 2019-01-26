# A minimal Docker image with Node and Puppeteer

# Immutable node build
FROM node:10.15.0-slim@sha256:bb4a5a0bdc9886b180d52b556b1e3f3f624bc8c13d50bd3edca1dbeb7aa7ac0b

# See https://crbug.com/795759
RUN apt-get update && apt-get install -yq libgconf-2-4

# Install git binary
RUN apt-get -y install git

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
# Note: this installs the necessary libs to make the bundled version of Chromium that Puppeteer
# installs, work.
RUN apt-get update && apt-get install -y wget --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome-unstable'})
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# Cache npm packages:
# COPY package*.json /app/
# WORKDIR /home/boostid
# RUN npm install

# Jest doesn't work in root directory so we move down
# COPY . /app/

# Add user so we don't need --no-sandbox.
RUN groupadd -r boostid && useradd -r -g boostid -G audio,video boostid \
    && mkdir -p /home/boostid/Downloads \
    && mkdir -p /home/boostid/app \
    && chown -R boostid:boostid /home/boostid
    # && chown -R boostid:boostid /app/node_modules

WORKDIR /home/boostid/app

# Run everything after as non-privileged user.
USER boostid

CMD ['/bin/bash']
