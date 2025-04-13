## [2.0.0](https://github.com/KyrptonaughtMC/Inventory-Sorter/compare/v1.9.1...v2.0.0) (2025-04-13)

### ⚠ BREAKING CHANGES

* removed custom middle click support
* configuration refactor

### Features

* added 1.21.5 support ([0231852](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/023185216f50b9b0bab575bfa07e6185a3016779))
* added a configuration validator ([7a09376](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/7a093766630ae805a83c7046391c11e30e503565))
* added a PredefinedLoader to better handle vanilla blocks ([44f8342](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/44f83427f436657f39c239ee397c819883c3f6ef))
* added a reload command for both the client and server ([8a8d52f](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/8a8d52f47b2e5cc6f0d000982dbd871203589c70))
* added a screenid command to allow the easy copying of a screenID ([fe0f5d5](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/fe0f5d5f335aa58a245090be860942985820276b))
* added external compatibility list configuration support for both server admins and players ([de5b9a5](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/de5b9a5d125e193d74bbc695f1315d8435e3b765))
* added permissions support ([c3135b6](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/c3135b6a8673b3b0b459c494eb941b22ac2d3529))
* added proper commands to manage the no-sort compatibility list without having to know the screenID [#113](https://github.com/KyrptonaughtMC/Inventory-Sorter/issues/113) ([ce05728](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/ce0572835679454b1bfb3ca19e6876e8c5db576b))
* button hiding now syncs from the server to the client to allow server owners to define must-hide buttons ([a370cfa](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/a370cfabe7b6b78caba5f77aec89b48a491dff3e))
* clients can now define their own sort prevention on top of the server rules ([e8c354a](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/e8c354a19de9a7e7da067db5bc6dd5b0d398407a))
* configuration refactor ([67f08e2](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/67f08e27171664cc1a5dc46eae1080983c0bd3cd))
* settings are now synced from the server to the client if the client mod is seen for the first time ([0faf916](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/0faf91633fc4bcf23f1081c08eb84431865a5fb1))

### Bug Fixes

* added support for sorting vaults from ominous vaults ([540bed5](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/540bed5c2ce5876514759799e5b90d848d6273c6))
* better dependency requirements to help issues like [#130](https://github.com/KyrptonaughtMC/Inventory-Sorter/issues/130) ([08951cc](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/08951cccbfe743fa4a101da4134ba541539ab8b2))
* better local resource loading [#129](https://github.com/KyrptonaughtMC/Inventory-Sorter/issues/129) ([53f3e71](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/53f3e71e3638f7237465935a4768b3c4db577513))
* better tooltip for the sort button ([f5ad6ef](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/f5ad6efa6581ce06d152a95afb6e03ea0106f042))
* changing the sort type via the command now works [#101](https://github.com/KyrptonaughtMC/Inventory-Sorter/issues/101) ([ceac187](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/ceac1878608f4c07782e7c05a173d801cb2a5fc3))
* depending on the correct fabric api [#126](https://github.com/KyrptonaughtMC/Inventory-Sorter/issues/126) ([aa5a6a5](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/aa5a6a5284c7909ff1490a94a546c1dd49a910c7))
* fixed name based sorting ([ed2b99b](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/ed2b99b6bdbf7834a6a966a79161915debf3f468))
* fixed the sort button staying highlighted after clicking it ([cce06c3](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/cce06c3c421b0ce27946737a9ec5618b7455019e))
* including required libs in the build [#129](https://github.com/KyrptonaughtMC/Inventory-Sorter/issues/129) ([ed3ea4b](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/ed3ea4b6510410b654e9c29fdabfd1eb24d66efb))
* migrated to cloth-config ([9d84fa1](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/9d84fa1de982bfbc52a5a7c9f8df18c800cec133))
* removed custom middle click support ([707fd02](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/707fd02c7f2b5e78e028ce120459865e66816610))
* settings now sync between the server and client for all basic options ([c0f3e96](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/c0f3e96c66ac3c9c630ef99f0fb89336a95834da))
* shulkers now close properly when sorted via the command ([2259fc9](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/2259fc95fe6f42d77dfaf020bbf7eab4bacf32d6))
* spectators can't sort containers anymore [#100](https://github.com/KyrptonaughtMC/Inventory-Sorter/issues/100) ([549b1d9](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/549b1d97868a36db3c81c2b8790a719491d957c7))
* the server settings don't override the client settings anymore and all settings can be changed via commands ([42925d7](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/42925d71fd50cc05969101a42bf6cab6f98122a6))
* typo in the mod description ([0aa0273](https://github.com/KyrptonaughtMC/Inventory-Sorter/commit/0aa0273e57891fa72b2df05d9263eb4cc6883a5d))
