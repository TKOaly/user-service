const { exec } = require('child_process')
require('dotenv').config()

if (process.argv.includes('staging')) {
  exec(`ssh ${process.env.STAGING_SERVER_URL} -i ${process.env.STAGING_SERVER_SSH_KEY} "cd /srv/user-service && git pull origin dev && git reset --hard origin/dev && docker build -t user-service . && docker run -p PORT:PORT --env-file=.env -d --name user-service-container user-service"`,
(error, stdout, stderr) => {
  console.log(stdout, error, stderr)
})
} else if (process.argv.includes('production')) {
  exec(`ssh ${process.env.PRODUCTION_SERVER_URL} "cd /srv/user-service && git pull origin master && git reset --hard origin/master && docker build -t user-service . && docker run -p PORT:PORT --env-file=.env -d --name user-service-container user-service"`)
}