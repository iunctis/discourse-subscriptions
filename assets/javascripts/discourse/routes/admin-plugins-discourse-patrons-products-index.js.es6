import AdminProduct from "discourse/plugins/discourse-patrons/discourse/models/admin-product";

export default Discourse.Route.extend({
  model() {
    return AdminProduct.findAll();
  },

  actions: {
    destroyProduct(product) {
      bootbox.confirm(
        I18n.t("discourse_patrons.admin.products.operations.destroy.confirm"),
        I18n.t("no_value"),
        I18n.t("yes_value"),
        confirmed => {
          if (confirmed) {
            product
              .destroy()
              .then(() => {
                this.controllerFor("adminPluginsDiscoursePatronsProductsIndex")
                  .get("model")
                  .removeObject(product);
              })
              .catch(data =>
                bootbox.alert(data.jqXHR.responseJSON.errors.join("\n"))
              );
          }
        }
      );
    }
  }
});