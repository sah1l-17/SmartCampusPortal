pipeline {
    agent any
    
    environment {
        // Docker Hub credentials
        DOCKER_HUB_CREDENTIALS = credentials('docker-hub-credentials')
        DOCKER_IMAGE_NAME = 'smart-campus-portal'
        DOCKER_TAG = "${BUILD_NUMBER}"
        
        // Application environment variables
        JWT_SECRET = credentials('jwt-secret')
        MONGODB_URI = credentials('mongodb-uri')
        
        // Deployment configuration
        STAGING_SERVER = credentials('staging-server')
        PRODUCTION_SERVER = credentials('production-server')
        
        // Notification settings
        SLACK_CHANNEL = '#deployments'
        EMAIL_RECIPIENTS = 'dev-team@company.com'
    }
    
    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "🔄 Checking out code from repository..."
                    checkout scm
                    
                    // Get commit information
                    env.GIT_COMMIT_MSG = sh(
                        script: 'git log -1 --pretty=%B',
                        returnStdout: true
                    ).trim()
                    
                    env.GIT_AUTHOR = sh(
                        script: 'git log -1 --pretty=%an',
                        returnStdout: true
                    ).trim()
                }
            }
        }
        
        stage('Environment Setup') {
            steps {
                script {
                    echo "🔧 Setting up build environment..."
                    
                    // Install Node.js dependencies
                    sh '''
                        echo "Installing backend dependencies..."
                        cd backend && npm ci
                        
                        echo "Installing frontend dependencies..."
                        cd ../frontend && npm ci
                    '''
                }
            }
        }
        
        stage('Code Quality & Security') {
            parallel {
                stage('Lint & Format') {
                    steps {
                        script {
                            echo "🔍 Running code quality checks..."
                            sh '''
                                # Backend linting
                                cd backend
                                npm run lint || true
                                
                                # Frontend linting
                                cd ../frontend
                                npm run lint || true
                            '''
                        }
                    }
                }
                
                stage('Security Scan') {
                    steps {
                        script {
                            echo "🔒 Running security vulnerability scan..."
                            sh '''
                                # Audit backend dependencies
                                cd backend && npm audit --audit-level=high || true
                                
                                # Audit frontend dependencies
                                cd ../frontend && npm audit --audit-level=high || true
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Testing') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        script {
                            echo "🧪 Running unit tests..."
                            sh '''
                                # Backend tests
                                cd backend
                                npm test || true
                                
                                # Frontend tests
                                cd ../frontend
                                npm test -- --run || true
                            '''
                        }
                    }
                    post {
                        always {
                            // Publish test results
                            publishTestResults testResultsPattern: '**/test-results.xml'
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'coverage',
                                reportFiles: 'index.html',
                                reportName: 'Coverage Report'
                            ])
                        }
                    }
                }
                
                stage('Integration Tests') {
                    steps {
                        script {
                            echo "🔗 Running integration tests..."
                            sh '''
                                # Start test database
                                docker run -d --name test-mongo -p 27018:27017 mongo:7.0
                                
                                # Wait for database to be ready
                                sleep 10
                                
                                # Run integration tests
                                cd backend
                                MONGODB_URI=mongodb://localhost:27018/test npm run test:integration || true
                                
                                # Cleanup
                                docker stop test-mongo && docker rm test-mongo
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Build Application') {
            steps {
                script {
                    echo "🏗️ Building application..."
                    sh '''
                        # Build frontend
                        cd frontend
                        npm run build
                        
                        # Verify build output
                        ls -la dist/
                    '''
                }
            }
        }
        
        stage('Build Docker Image') {
            steps {
                script {
                    echo "🐳 Building Docker image..."
                    
                    // Build the Docker image
                    def image = docker.build("${DOCKER_IMAGE_NAME}:${DOCKER_TAG}")
                    
                    // Tag as latest for main branch
                    if (env.BRANCH_NAME == 'main') {
                        image.tag('latest')
                    }
                    
                    // Store image for later use
                    env.DOCKER_IMAGE = "${DOCKER_IMAGE_NAME}:${DOCKER_TAG}"
                }
            }
        }
        
        stage('Security Scan Docker Image') {
            steps {
                script {
                    echo "🔍 Scanning Docker image for vulnerabilities..."
                    sh '''
                        # Install Trivy if not available
                        if ! command -v trivy &> /dev/null; then
                            echo "Installing Trivy..."
                            wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -
                            echo deb https://aquasecurity.github.io/trivy-repo/deb $(lsb_release -sc) main | sudo tee -a /etc/apt/sources.list.d/trivy.list
                            sudo apt-get update && sudo apt-get install trivy
                        fi
                        
                        # Scan the image
                        trivy image --exit-code 0 --severity HIGH,CRITICAL ${DOCKER_IMAGE}
                    '''
                }
            }
        }
        
        stage('Push to Registry') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                    branch 'staging'
                }
            }
            steps {
                script {
                    echo "📤 Pushing Docker image to registry..."
                    
                    docker.withRegistry('https://registry.hub.docker.com', 'docker-hub-credentials') {
                        def image = docker.image("${DOCKER_IMAGE}")
                        image.push()
                        
                        if (env.BRANCH_NAME == 'main') {
                            image.push('latest')
                        }
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'staging'
                }
            }
            steps {
                script {
                    echo "🚀 Deploying to staging environment..."
                    
                    // Deploy using docker-compose
                    sh '''
                        # Copy docker-compose files to staging server
                        scp docker-compose.yaml docker-compose.staging.yaml ${STAGING_SERVER}:/opt/smart-campus/
                        
                        # Deploy on staging server
                        ssh ${STAGING_SERVER} "
                            cd /opt/smart-campus
                            export DOCKER_TAG=${DOCKER_TAG}
                            export JWT_SECRET=${JWT_SECRET}
                            export MONGODB_URI=${MONGODB_URI}
                            docker-compose -f docker-compose.yaml -f docker-compose.staging.yaml up -d
                        "
                    '''
                }
            }
        }
        
        stage('Smoke Tests') {
            when {
                anyOf {
                    branch 'develop'
                    branch 'staging'
                    branch 'main'
                }
            }
            steps {
                script {
                    echo "💨 Running smoke tests..."
                    sh '''
                        # Wait for application to be ready
                        sleep 30
                        
                        # Health check
                        curl -f http://staging.smartcampus.com/health || exit 1
                        
                        # Basic API tests
                        curl -f http://staging.smartcampus.com/api/auth/health || exit 1
                    '''
                }
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    // Manual approval for production deployment
                    input message: 'Deploy to Production?', ok: 'Deploy',
                          submitterParameter: 'APPROVER'
                    
                    echo "🚀 Deploying to production environment..."
                    echo "Approved by: ${env.APPROVER}"
                    
                    sh '''
                        # Blue-Green deployment strategy
                        ssh ${PRODUCTION_SERVER} "
                            cd /opt/smart-campus
                            
                            # Backup current version
                            docker-compose ps > backup/services-$(date +%Y%m%d-%H%M%S).txt
                            
                            # Deploy new version
                            export DOCKER_TAG=${DOCKER_TAG}
                            export JWT_SECRET=${JWT_SECRET}
                            export MONGODB_URI=${MONGODB_URI}
                            
                            # Rolling update
                            docker-compose pull
                            docker-compose up -d --no-deps backend
                            sleep 30
                            docker-compose up -d --no-deps frontend
                            
                            # Cleanup old images
                            docker image prune -f
                        "
                    '''
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "🧹 Cleaning up workspace..."
                
                // Archive artifacts
                archiveArtifacts artifacts: '**/logs/*.log', allowEmptyArchive: true
                
                // Clean up Docker images
                sh '''
                    docker image prune -f
                    docker container prune -f
                '''
            }
        }
        
        success {
            script {
                echo "✅ Pipeline completed successfully!"
                
                // Send success notification
                slackSend(
                    channel: env.SLACK_CHANNEL,
                    color: 'good',
                    message: """
                        ✅ *Smart Campus Portal* - Deployment Successful
                        
                        *Branch:* ${env.BRANCH_NAME}
                        *Build:* #${env.BUILD_NUMBER}
                        *Commit:* ${env.GIT_COMMIT_MSG}
                        *Author:* ${env.GIT_AUTHOR}
                        *Duration:* ${currentBuild.durationString}
                        
                        *Environment:* ${env.BRANCH_NAME == 'main' ? 'Production' : 'Staging'}
                        *Docker Image:* ${env.DOCKER_IMAGE}
                    """
                )
            }
        }
        
        failure {
            script {
                echo "❌ Pipeline failed!"
                
                // Send failure notification
                slackSend(
                    channel: env.SLACK_CHANNEL,
                    color: 'danger',
                    message: """
                        ❌ *Smart Campus Portal* - Deployment Failed
                        
                        *Branch:* ${env.BRANCH_NAME}
                        *Build:* #${env.BUILD_NUMBER}
                        *Commit:* ${env.GIT_COMMIT_MSG}
                        *Author:* ${env.GIT_AUTHOR}
                        *Duration:* ${currentBuild.durationString}
                        
                        *Failed Stage:* ${env.STAGE_NAME}
                        *Build URL:* ${env.BUILD_URL}
                    """
                )
                
                // Send email notification
                emailext(
                    subject: "❌ Smart Campus Portal - Build Failed #${env.BUILD_NUMBER}",
                    body: """
                        The Smart Campus Portal build has failed.
                        
                        Branch: ${env.BRANCH_NAME}
                        Build Number: ${env.BUILD_NUMBER}
                        Failed Stage: ${env.STAGE_NAME}
                        
                        Please check the build logs: ${env.BUILD_URL}
                    """,
                    to: env.EMAIL_RECIPIENTS
                )
            }
        }
        
        unstable {
            script {
                echo "⚠️ Pipeline completed with warnings!"
                
                slackSend(
                    channel: env.SLACK_CHANNEL,
                    color: 'warning',
                    message: """
                        ⚠️ *Smart Campus Portal* - Build Unstable
                        
                        *Branch:* ${env.BRANCH_NAME}
                        *Build:* #${env.BUILD_NUMBER}
                        *Duration:* ${currentBuild.durationString}
                        
                        Please review the build logs for warnings.
                    """
                )
            }
        }
    }
}
