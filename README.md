# Description
Prototype VR Application for viewing observations of the sky.
This project is a collaboration between the Met Office Informatics Lab & Met Office College.

# Building and Running

## Credentials
You will need a valid `Github` account and an `AWS IAM` with keys to access `s3` and `dynamoDB`.

## Building and Running in Dev
Ensure you have `Docker` installed.
Edit your `/etc/hosts` file adding `docker-machine` as the alias for the ip address of your docker-machine VM.  
Navigate to the project folder and run `docker-compose -f dev-docker-compose.yml up -d --build`.  
Service is now running on `http://docker-machine`.  

To destroy running containers use `docker-compose -f dev-docker-compose.yml down`

## Building & Running in Production with Terraform
Build and run the service on AWS `terraform apply terraform`.  
Wait a few minutes for the servers to configure etc.  
Service is now running on `http://moc-vr.informaticslab.co.uk`.  

Teardown service using `terraform destroy terraform`.

### Redeploying app in Production with Docker Compose
To redeploy the service on the same infrastructure:  
 * make your minor changes to the source code and merge them into `master` branch.
 * merging to `master` will trigger a build of the image in `quay.io`.
 * login to the current server.
 * assume root perms by using `sudo su`.
 * change directory to the system root `cd /`.
 * run `docker-compose pull` to obtain the latest docker image of the app.
 * run `docker-compose down` to stop and remove the current app containers.
 * run `docker-compose up -d --build` to spin up the updated containers.

# Credits
Used to handle multipart uploads
https://github.com/richardgirges/express-fileupload

Used to handle authentication
https://github.com/bitly/oauth2_proxy
