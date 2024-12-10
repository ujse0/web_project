## Deployment Process

### Login to Amazon Web Service

- Free to use
- Wide range of services for computing, storage, databases

### Create EC2 Instance

- Select **Ubuntu**.
- Create a security group.

### Connect to EC2 Instance

Navigate to the folder containing the key file(.pem) and run the following command:

```bash

ssh -i "pem_name" ubuntu@ec2-35-179-88-45.eu-west-2.compute.amazonaws.com

```

### Transfer Files to EC2 Instance

```bash

scp -i <pem_path> -r <folder_path> ubuntu@35.179.88.45:/home/ubuntu/

or 

git clone https://github.com/ujse0/web_project.git
```

### Configure EC2 Memory Swap

```bash

# Set swap memory to 2GB
sudo dd if=/dev/zero of=/swapfile bs=128M count=16

sudo chmod 600 /swapfile

sudo mkswap /swapfile

sudo swapon /swapfile

```

```bash

sudo vi /etc/fstab

# Add the following line and save:
/swapfile swap swap defaults 0 0

```

```bash

# Check memory status using the free command
free

```

### Modify EBS Volume

- Go to **EBS > Volume > Actions > Modify Volume** and change the size to 25GB.

Access the EC2 instance and run the following commands:

```bash

sudo growpart /dev/xvda 1  # Extend the partition

```

If it doesn't work, run the following and try again:

```bash

# Temporary fix
sudo mount -o size=10M,rw,nodev,nosuid -t tmpfs tmpfs /tmp

```

**Expand the File System**

```bash

sudo resize2fs /dev/xvda1

```

Verify the changes:

```bash

df -h

```

### Install Node.js and npm

1. **Update packages:**
    
    ```bash
    
    sudo apt update
    
    ```
    
2. **Install Node.js (LTS version):**
    
    ```bash
    
    sudo apt install -y nodejs
    
    ```
    
3. **Install npm:**
    
    ```bash
    
    sudo apt install -y npm
    
    ```
    
4. **Check versions:**
    
    ```bash
    
    node -v
    npm -v
    
    ```
    

### Install Docker

```bash

curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

docker --version

sudo service docker start

# Configure user permissions
sudo usermod -aG docker $USER
newgrp docker

```

```bash

# Install Docker Compose V1
sudo apt update
sudo apt install docker-compose

docker-compose --version

```

### Run Containers

```bash

docker-compose up -d

```

### Start the Server

```jsx
npm start
```

URL

http://ec2-35-179-88-45.eu-west-2.compute.amazonaws.com:8000/

Username: a Password: a 

or 

Username: b Password: b

or 

Username: test Password: test
