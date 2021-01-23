#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkTestTsStack } from '../lib/cdk-test-ts-stack';

const app = new cdk.App();
new CdkTestTsStack(app, 'CdkTestTsStack');
