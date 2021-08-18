(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['report_admin.hbs'] = template({"1":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "		<tr><td>TSP Session Type:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"tsp_stype") || (depth0 != null ? lookupProperty(depth0,"tsp_stype") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tsp_stype","hash":{},"data":data,"loc":{"start":{"line":6,"column":37},"end":{"line":6,"column":50}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>TSP Rewards:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"tsp_rewards") || (depth0 != null ? lookupProperty(depth0,"tsp_rewards") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tsp_rewards","hash":{},"data":data,"loc":{"start":{"line":7,"column":32},"end":{"line":7,"column":47}}}) : helper)))
    + "</td></tr>\r\n";
},"3":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "		<tr><td>Levels Gained:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ses_levels") || (depth0 != null ? lookupProperty(depth0,"ses_levels") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ses_levels","hash":{},"data":data,"loc":{"start":{"line":9,"column":34},"end":{"line":9,"column":48}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Points Earned:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ses_points") || (depth0 != null ? lookupProperty(depth0,"ses_points") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ses_points","hash":{},"data":data,"loc":{"start":{"line":10,"column":34},"end":{"line":10,"column":48}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Coins Earned:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ses_coins") || (depth0 != null ? lookupProperty(depth0,"ses_coins") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ses_coins","hash":{},"data":data,"loc":{"start":{"line":11,"column":33},"end":{"line":11,"column":46}}}) : helper)))
    + "</td></tr>\r\n";
},"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<p><b>Session Details:</b></p>\r\n<table style=\"table-layout: auto;\">\r\n	<tbody>\r\n		<tr><td>Is TSP Session?:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"is_tsp") || (depth0 != null ? lookupProperty(depth0,"is_tsp") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"is_tsp","hash":{},"data":data,"loc":{"start":{"line":4,"column":36},"end":{"line":4,"column":46}}}) : helper)))
    + "</td></tr>\r\n"
    + ((stack1 = lookupProperty(helpers,"if").call(alias1,(depth0 != null ? lookupProperty(depth0,"is_tsp") : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.program(3, data, 0),"data":data,"loc":{"start":{"line":5,"column":0},"end":{"line":12,"column":7}}})) != null ? stack1 : "")
    + "		<tr><td>Number of Tics:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"tics") || (depth0 != null ? lookupProperty(depth0,"tics") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tics","hash":{},"data":data,"loc":{"start":{"line":13,"column":35},"end":{"line":13,"column":43}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Longest Tic-free Interval:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"longest_tfi") || (depth0 != null ? lookupProperty(depth0,"longest_tfi") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"longest_tfi","hash":{},"data":data,"loc":{"start":{"line":14,"column":46},"end":{"line":14,"column":61}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Number of 10s Tic-Free Intervals:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"tens_tfis") || (depth0 != null ? lookupProperty(depth0,"tens_tfis") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tens_tfis","hash":{},"data":data,"loc":{"start":{"line":15,"column":53},"end":{"line":15,"column":66}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>End Time:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"end_ts") || (depth0 != null ? lookupProperty(depth0,"end_ts") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"end_ts","hash":{},"data":data,"loc":{"start":{"line":16,"column":29},"end":{"line":16,"column":39}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Session Duration:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"duration") || (depth0 != null ? lookupProperty(depth0,"duration") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"duration","hash":{},"data":data,"loc":{"start":{"line":17,"column":37},"end":{"line":17,"column":49}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>TicTrainer Version:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"tt_version") || (depth0 != null ? lookupProperty(depth0,"tt_version") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tt_version","hash":{},"data":data,"loc":{"start":{"line":18,"column":39},"end":{"line":18,"column":53}}}) : helper)))
    + "</td></tr>\r\n	</tbody>\r\n</table>";
},"useData":true});
templates['report_trainer.hbs'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<p><b>Session Details:</b></p>\r\n<table style=\"table-layout: auto;\">\r\n	<tbody>\r\n		<tr><td>Levels Gained:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ses_levels") || (depth0 != null ? lookupProperty(depth0,"ses_levels") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ses_levels","hash":{},"data":data,"loc":{"start":{"line":4,"column":34},"end":{"line":4,"column":48}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Points Earned:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ses_points") || (depth0 != null ? lookupProperty(depth0,"ses_points") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ses_points","hash":{},"data":data,"loc":{"start":{"line":5,"column":34},"end":{"line":5,"column":48}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Coins Earned:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ses_coins") || (depth0 != null ? lookupProperty(depth0,"ses_coins") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ses_coins","hash":{},"data":data,"loc":{"start":{"line":6,"column":33},"end":{"line":6,"column":46}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Number of Tics:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"tics") || (depth0 != null ? lookupProperty(depth0,"tics") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tics","hash":{},"data":data,"loc":{"start":{"line":7,"column":35},"end":{"line":7,"column":43}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Longest Tic-free Interval:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"longest_tfi") || (depth0 != null ? lookupProperty(depth0,"longest_tfi") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"longest_tfi","hash":{},"data":data,"loc":{"start":{"line":8,"column":46},"end":{"line":8,"column":61}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>User's Personal Best Tic-free Interval:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"best_tfi") || (depth0 != null ? lookupProperty(depth0,"best_tfi") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"best_tfi","hash":{},"data":data,"loc":{"start":{"line":9,"column":59},"end":{"line":9,"column":71}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Number of 10s Tic-Free Intervals:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"tens_tfis") || (depth0 != null ? lookupProperty(depth0,"tens_tfis") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tens_tfis","hash":{},"data":data,"loc":{"start":{"line":10,"column":53},"end":{"line":10,"column":66}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Session Duration:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"duration") || (depth0 != null ? lookupProperty(depth0,"duration") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"duration","hash":{},"data":data,"loc":{"start":{"line":11,"column":37},"end":{"line":11,"column":49}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>TicTrainer Version:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"tt_version") || (depth0 != null ? lookupProperty(depth0,"tt_version") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tt_version","hash":{},"data":data,"loc":{"start":{"line":12,"column":39},"end":{"line":12,"column":53}}}) : helper)))
    + "</td></tr>\r\n	</tbody>\r\n</table>";
},"useData":true});
templates['report_user.hbs'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<p><b>Session Details:</b></p>\r\n<table style=\"table-layout: auto;\">\r\n	<tbody>\r\n		<tr><td>Levels Gained:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ses_levels") || (depth0 != null ? lookupProperty(depth0,"ses_levels") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ses_levels","hash":{},"data":data,"loc":{"start":{"line":4,"column":34},"end":{"line":4,"column":48}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Points Earned:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ses_points") || (depth0 != null ? lookupProperty(depth0,"ses_points") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ses_points","hash":{},"data":data,"loc":{"start":{"line":5,"column":34},"end":{"line":5,"column":48}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Coins Earned:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"ses_coins") || (depth0 != null ? lookupProperty(depth0,"ses_coins") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"ses_coins","hash":{},"data":data,"loc":{"start":{"line":6,"column":33},"end":{"line":6,"column":46}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Number of Tics:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"tics") || (depth0 != null ? lookupProperty(depth0,"tics") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"tics","hash":{},"data":data,"loc":{"start":{"line":7,"column":35},"end":{"line":7,"column":43}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Longest Tic-free Interval:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"longest_tfi") || (depth0 != null ? lookupProperty(depth0,"longest_tfi") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"longest_tfi","hash":{},"data":data,"loc":{"start":{"line":8,"column":46},"end":{"line":8,"column":61}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Personal Best Tic-free Interval:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"best_tfi") || (depth0 != null ? lookupProperty(depth0,"best_tfi") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"best_tfi","hash":{},"data":data,"loc":{"start":{"line":9,"column":52},"end":{"line":9,"column":64}}}) : helper)))
    + "</td></tr>\r\n	</tbody>\r\n</table>";
},"useData":true});
templates['user_status.hbs'] = template({"compiler":[8,">= 4.3.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : (container.nullContext || {}), alias2=container.hooks.helperMissing, alias3="function", alias4=container.escapeExpression, lookupProperty = container.lookupProperty || function(parent, propertyName) {
        if (Object.prototype.hasOwnProperty.call(parent, propertyName)) {
          return parent[propertyName];
        }
        return undefined
    };

  return "<p><b>User status after session:</b></p>\r\n<table style=\"table-layout: auto;\">\r\n	<tbody>\r\n		<tr><td>Level:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"level") || (depth0 != null ? lookupProperty(depth0,"level") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"level","hash":{},"data":data,"loc":{"start":{"line":4,"column":26},"end":{"line":4,"column":35}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Points:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"points") || (depth0 != null ? lookupProperty(depth0,"points") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"points","hash":{},"data":data,"loc":{"start":{"line":5,"column":27},"end":{"line":5,"column":37}}}) : helper)))
    + "</td></tr>\r\n		<tr><td>Coins:</td> <td>"
    + alias4(((helper = (helper = lookupProperty(helpers,"coins") || (depth0 != null ? lookupProperty(depth0,"coins") : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"coins","hash":{},"data":data,"loc":{"start":{"line":6,"column":26},"end":{"line":6,"column":35}}}) : helper)))
    + "</td></tr>\r\n	</tbody>\r\n</table>";
},"useData":true});
})();