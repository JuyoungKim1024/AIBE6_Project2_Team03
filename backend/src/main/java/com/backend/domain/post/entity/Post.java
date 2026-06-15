package com.backend.domain.post.entity;

import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

@Entity
@Table(name="posts")
public class Post extends BaseEntity {
}
