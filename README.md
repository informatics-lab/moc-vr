# Description
MOC-VR Application. Prototype for viewing observations in VR. 


## Credentials
You will need an `AWS IAM` with keys to access `s3` and `dynamoDB`.


## Dev Install
`npm install`


## Dev Running
`npm run start`


## Building & Running with Docker   
This will simply build the application inside a docker container.    
Build the docker image:    
`docker build -t moc-vr .`  
Run the container:  
```
docker run -d --name moc-vr \  
    -p 3000:3000 \  
    -e "MOC_VR_AWS_ACCESS_KEY_ID=<YOUR KEY>" \  
    -e "MOC_VR_AWS_SECRET_ACCESS_KEY=<YOUR SECRET>" \  
    moc-vr
```  
Check container is running:  
`docker ps`  
Visit service in browser:  
`http://yourdomain:3000/`


## Building & Running with Docker Compose
This will also build the oauth2_proxy service to restrict access to the application.  
Build the containers:     
`docker-compose up -d --build`  
Check containers are running:  
`docker ps`   


## Building & Running with Terraform
Build and run the service:
`terraform apply terraform`

# Credits
Used to handle multipart uploads
https://github.com/richardgirges/express-fileupload

Used to handle authentication
https://github.com/bitly/oauth2_proxy
