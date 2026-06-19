import org.gradle.kotlin.dsl.implementation
import org.gradle.kotlin.dsl.testImplementation
import org.gradle.kotlin.dsl.testRuntimeOnly

plugins {
	java
	id("org.springframework.boot") version "4.0.6"
	id("io.spring.dependency-management") version "1.1.7"
}

group = "com"
version = "0.0.1-SNAPSHOT"
description = "backend"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation(platform("software.amazon.awssdk:bom:2.28.0"))
	implementation("software.amazon.awssdk:s3")

	implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310")

	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-webmvc")
	implementation("org.springframework.boot:spring-boot-starter-flyway")
	runtimeOnly("com.h2database:h2")
	// Security
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-mail")

    //WebSocket
    implementation("org.springframework.boot:spring-boot-starter-websocket")

	// MySQL
	runtimeOnly("com.mysql:mysql-connector-j")

	// Flyway MySQL support
	implementation("org.flywaydb:flyway-mysql")

	// Lombok
	compileOnly("org.projectlombok:lombok")
	annotationProcessor("org.projectlombok:lombok")

	// Devtools
	developmentOnly("org.springframework.boot:spring-boot-devtools")

	// Test
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.boot:spring-boot-starter-data-jpa-test")
	testImplementation("org.springframework.boot:spring-boot-starter-flyway-test")
	testImplementation("org.springframework.boot:spring-boot-starter-webmvc-test")
	testImplementation("org.springframework.security:spring-security-test")
	runtimeOnly("com.h2database:h2")

	testRuntimeOnly("com.h2database:h2")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

	testCompileOnly("org.projectlombok:lombok")
	testAnnotationProcessor("org.projectlombok:lombok")

}

tasks.withType<Test> {
	useJUnitPlatform()
}