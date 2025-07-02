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
        stage('Stop Existing Container') {
            steps {
                script {
                    sh """
                    if [ \$(docker ps -q -f name=${CONTAINER_NAME}) ]; then
                        docker stop ${CONTAINER_NAME}
                        docker rm ${CONTAINER_NAME}
                    fi
                    """
                }
            }
        }
        stage('Run Docker Container') {
            steps {
                script {
                    sh """
                    docker run -d --name ${CONTAINER_NAME} -p 5000:5000 -p 5173:5173 ${IMAGE_NAME}
                    """
                }
            }
        }
    }
    post {
        always {
            echo 'Pipeline completed.'
        }
    }
}
