#!/bin/bash

rm -rf ./src/dapp/accounts/*

ganache-cli \
-m "test 123" \
--defaultBalanceEther=1000 \
--accounts=100 \
--gasLimit=99999999 \
--account_keys_path=./src/dapp/accounts/accounts.json