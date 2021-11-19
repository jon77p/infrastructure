terraform {
  backend "remote" {
    organization = "jon77p-xyz"

    workspaces {
      name = "infrastructure"
    }
  }

  required_version = ">= 0.13.0"
}
