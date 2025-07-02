pipeline {
    agent any

    environment {
        IMAGE_NAME = 'sahil069917/smartcampusportal:latest'
        CONTAINER_NAME = 'campusportal'
    }

    stages {
        stage('Pull Docker Image') {
            steps {
                script {
                    bat "docker pull ${IMAGE_NAME}"
                }
            }
        }

        stage('Remove Existing Container') {
            steps {
                script {
                    bat """
                    @echo off
                    echo Checking for existing containers...
                    for /f "tokens=*" %%i in ('docker ps -aq -f "name=${CONTAINER_NAME}" 2^>nul') do (
                        echo Stopping container %%i
                        docker stop %%i || echo Failed to stop container %%i - continuing
                        echo Removing container %%i
                        docker rm %%i || echo Failed to remove container %%i - continuing
                    )
                    echo Cleanup completed
                    """
                }
            }
        }

        stage('Run Docker Container') {
            steps {
                script {
                    bat """
                    echo Starting new container...
                    docker run -d --name ${CONTAINER_NAME} -p 5000:5000 -p 5173:5173 ${IMAGE_NAME}
                    echo Container started successfully
                    """
                }
            }
        }

        stage('Verify Container') {
            steps {
                script {
                    bat """
                    echo Verifying container status...
                    docker ps -f "name=${CONTAINER_NAME}" --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}"
                    timeout /t 10 /nobreak
                    docker logs ${CONTAINER_NAME} --tail 20
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution completed'
            bat """
            echo Final container status:
            docker ps -a -f "name=${CONTAINER_NAME}" --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}"
            """
        }
        success {
            echo 'Pipeline succeeded! Application should be available at http://localhost:5000'
        }
        failure {
            echo 'Pipeline failed! Check the logs above for errors.'
            bat "docker logs ${CONTAINER_NAME} --tail 50 || echo No container logs available"
        }
    }
}
