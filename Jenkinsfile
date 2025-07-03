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
                    sh "docker pull ${IMAGE_NAME}"
                }
            }
        }

        stage('Remove Existing Container') {
            steps {
                script {
                    sh """
                    echo "Checking for existing containers..."
                    docker ps -aq -f name=${CONTAINER_NAME} | while read id; do
                        echo "Stopping container \$id"
                        docker stop \$id || echo "Failed to stop container \$id - continuing"
                        echo "Removing container \$id"
                        docker rm \$id || echo "Failed to remove container \$id - continuing"
                    done
                    echo "Cleanup completed"
                    """
                }
            }
        }

        stage('Run Docker Container') {
            steps {
                script {
                    sh """
                    echo "Starting new container..."
                    docker run -d --name ${CONTAINER_NAME} -p 5000:5000 -p 5173:5173 ${IMAGE_NAME}
                    echo "Container started successfully"
                    """
                }
            }
        }

        stage('Verify Container') {
            steps {
                script {
                    sh """
                    echo "Verifying container status..."
                    docker ps -f name=${CONTAINER_NAME} --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}"
                    sleep 10
                    docker logs ${CONTAINER_NAME} --tail 20
                    """
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline execution completed'
            script {
                sh """
                echo "Final container status:"
                docker ps -a -f name=${CONTAINER_NAME} --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}"
                """
            }
        }
        success {
            echo 'Pipeline succeeded! Application should be available at http://localhost:5000'
        }
        failure {
            echo 'Pipeline failed! Check the logs above for errors.'
            script {
                sh "docker logs ${CONTAINER_NAME} --tail 50 || echo 'No container logs available'"
            }
        }
    }
}
