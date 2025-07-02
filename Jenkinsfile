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
                    bat "docker pull %IMAGE_NAME%"
                }
            }
        }

        stage('Remove Existing Container') {
            steps {
                script {
                    bat '''
                    FOR /F "tokens=*" %%i IN ('docker ps -a -q -f "name=%CONTAINER_NAME%"') DO (
                        docker stop %%i || exit 0
                        docker rm %%i
                    )
                    '''
                }
            }
        }

        stage('Run Docker Container') {
            steps {
                script {
                    bat "docker run -d --name %CONTAINER_NAME% -p 5000:5000 -p 5173:5173 %IMAGE_NAME%"
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
