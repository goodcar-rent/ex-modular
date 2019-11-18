# ex-modular
exModular project - modular configuration system for Express apps

After app builder, express'es app object will have
`exModular` property with API:
* `app.exModular.modules` array: list of modules with their dependencies. Use `app.exModular.checkDeps()` to check if all modules have proper instantiated dependencies. 
