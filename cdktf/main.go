package main

import (
    "github.com/aws/constructs-go/constructs/v10"
    "github.com/aws/jsii-runtime-go"
    "github.com/hashicorp/terraform-cdk-go/cdktf"
)

func NewTFStack(scope constructs.Construct, id string) cdktf.TerraformStack {
    stack := cdktf.NewTerraformStack(scope, &id)

    // The code that defines your stack goes here

    return stack
}

func main() {
    app := cdktf.NewApp(nil)

    organization := jsii.String("jon77p-xyz")
    workspace := cdktf.NewNamedRemoteWorkspace(jsii.String("infrastructure"))
    hashicorpCloudHostname := jsii.String("app.terraform.io")
    hashicorpCloud := jsii.String("hashicorp-cloud")

    stack := NewTFStack(app, "cdktf")
    cdktf.NewRemoteBackend(stack, &cdktf.RemoteBackendProps{
        Hostname:     hashicorpCloudHostname,
        Organization: organization,
        Workspaces:   workspace,
    })

    remoteState := cdktf.NewDataTerraformRemoteState(stack, hashicorpCloud, &cdktf.DataTerraformRemoteStateRemoteConfig{
        Workspaces:   workspace,
        Organization: organization,
    })

    oci := remoteState.Get(jsii.String("oci"))

    cdktf.NewTerraformOutput(stack, jsii.String("oci"), &cdktf.TerraformOutputConfig{
        Value: oci,
    })

    app.Synth()
}
