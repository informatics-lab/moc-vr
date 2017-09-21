# Description
Prototype VR Application for viewing observations of the sky.  
This project is a collaboration between the Met Office Informatics Lab & Met Office College.  

# Building and Running

## Credentials
You will need a valid `Github` account and an `AWS IAM` with keys to access `s3` and `dynamoDB`.  

## Spinning up with `docker-compose` in DEV
Ensure you have `Docker` installed.  
Edit your `/etc/hosts` file adding `docker-machine` as the alias for the ip address of your docker-machine VM.
Ensure `https://github.com/organizations/met-office-lab/settings/applications/505508` has the following properties set:
 * `Homepage URL` : `http://docker-machine`
 * `Authorization callback URL` : `http://docker-machine/auth/github/callback`
 
### Environment Variables
You must have the following environment variables set:
 * `MOC_VR_AWS_ACCESS_KEY_ID` = AWS IAM access key id
 * `MOC_VR_AWS_SECRET_ACCESS_KEY` = AWS IAM secret access key token
 * `MOC_VR_OAUTH_CLIENT_ID` = github (DEV) oauth2 client id token
 * `MOC_VR_OAUTH_CLIENT_SECRET` = github (DEV) oauth2 client secret token
 * `DOMAIN` = `docker-machine`
 * `SESSION_SECRET` = a secret for your sessions
 
### Running
Navigate to the project folder and run `docker-compose -f dev-docker-compose.yml up -d --build`.    
Service is now running on `http://docker-machine`.    

### Tear Down
To destroy running containers use `docker-compose -f dev-docker-compose.yml down`  

## Spinning up with `terraform` in PROD 
You must have a local `AWS IAM` with privileges to create the infrastructure laid out in the terraform config 
and a `credentials.sh` with the following.

### File contents `credentials.sh` 
You must have the following environment variables set:
 * `MOC_VR_AWS_ACCESS_KEY_ID` = AWS IAM access key id
 * `MOC_VR_AWS_SECRET_ACCESS_KEY` = AWS IAM secret access key token
 * `MOC_VR_OAUTH_CLIENT_ID` = github oauth2 client id token
 * `MOC_VR_OAUTH_CLIENT_SECRET` = github oauth2 client secret token
 * `DOMAIN` = `moc-vr.informaticslab.co.uk`
 * `SESSION_SECRET` = a secret for your sessions

### Running
Build and run the service on AWS `terraform apply terraform`.    
Wait a few minutes for the servers to configure etc.    
Service is now running on `http://moc-vr.informaticslab.co.uk`. 

### Tear Down
Teardown service using `terraform destroy terraform`.  

### Redeploying app in Production with `docker-compose`
To redeploy the service on the same infrastructure (this should not be required as we have `watchtower`):    
 * make your minor changes to the source code and merge them into `master` branch.  
 * merging to `master` will trigger a build of the image in `quay.io`.  
 * login to the current server.  
 * assume root perms by using `sudo su`.  
 * change directory to the system root `cd /`.  
 * run `docker-compose pull` to obtain the latest docker image of the app.  
 * run `docker-compose down` to stop and remove the current app containers.  
 * run `docker-compose up -d --build` to spin up the updated containers.  

# Current Application Architecture

### Auth
 * Github OAuth2.0

### AWS Services
 * EC2 instance - runs docker with node.js application deployed as single docker container.
 * S3 bucket - stores images.
 * Lambda - triggered by image uploads, produces muli-resolution images for use in the app.
 * DynamoDB - stores weather obs.

# Credits
Used to handle multipart uploads  
https://github.com/richardgirges/express-fileupload
