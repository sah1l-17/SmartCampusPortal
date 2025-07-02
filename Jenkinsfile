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
                    bat "docker pull ${env.IMAGE_NAME}"
                }
            }
        }

        stage('Remove Existing Container') {
            steps {
                script {
                    // More reliable way to stop and remove containers
                    bat """
                    @echo off
                    for /f "tokens=*" %%i in ('docker ps -aq -f "name=${env.CONTAINER_NAME}"') do (
                        docker stop %%i
                        docker rm %%i
                    )
                    """
                }
            }
        }

        stage('Run Docker Container') {
            steps {
                script {
                    bat "docker run -d --name ${env.CONTAINER_NAME} -p 5000:5000 -p 5173:5173 ${env.IMAGE_NAME}"
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline completed.'
        }
        failure {
            echo 'Pipeline failed!'
            // You can add additional failure notifications here
        }
        success {
            echo 'Pipeline succeeded!'
            // You can add additional success notifications here
        }
    }
}
