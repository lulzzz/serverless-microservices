module.exports = async function(context, req, products) {
  context.log("ListProducts HTTP trigger function processed a request.");

  context.res = {
    body: products
  };
};
