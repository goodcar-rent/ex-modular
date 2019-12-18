# ex-modular
exModular project - modular configuration system for Express apps

After app builder, express'es app object will have
`exModular` property with API:
* user system - user accounts, etc
* roles
* storage support (all KNEX-compatible databases)
* CRUD routes
* models with typed access to storage
* `app.exModular.modules` array: list of modules with their dependencies. Use `app.exModular.checkDeps()` to check if all modules have proper instantiated dependencies. 
