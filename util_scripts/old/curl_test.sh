#!/bin/bash

ma=$(curl -d "source=manageAccount&id=u0&pw=a" -X POST http://localhost:8888/account/)
echo ${#ma}

ma=$(curl -d "source=newSession&id=u0&pw=a&lid=t0" -X POST http://localhost:8888/session/)
echo ${#ma}

