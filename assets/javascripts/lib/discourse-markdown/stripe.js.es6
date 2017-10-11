import { registerOption } from 'pretty-text/pretty-text';

registerOption((siteSettings, opts) => {
    opts.features['discourse_donations'] = !!siteSettings.discourse_donations_enabled;
});

function validationErrors(tagInfo, content) {
    let errors = [];
    if (!Discourse.SiteSettings['discourse_donations_public_key']) { errors.push("missing key (site setting)"); }
    if (!Discourse.SiteSettings['discourse_donations_currency']) { errors.push("missing currency (site setting)"); }
    if (!Discourse.SiteSettings['stripe_name']) { errors.push("missing name (site setting)"); }
    if (!Discourse.SiteSettings['discourse_donations_hide_zip_code']) { errors.push("missing hide zip code (site setting)"); }
    if (!tagInfo.attrs['amount']) { errors.push("missing amount"); }
    if (!content) { errors.push("missing description"); }
    return errors;
}

function replaceWithStripeOrError(state, tagInfo, content) {
    let errors = validationErrors(tagInfo, content);
    if (errors.length) {
        displayErrors(state, errors);
    } else {
        insertCheckout(state, tagInfo, content);
    }
    return true;
}

function displayErrors(state, errors) {
    let token = state.push('div-open', 'div', 1);
    token.attrs = [['class', 'stripe-errors']];
    token = state.push('html_inline', '', 0);
    token.content = "Stripe checkout can't be rendered: " + errors.join(", ");
    state.push('div-close', 'div', -1);
}

function insertCheckout(state, tagInfo, content) {
    let token = state.push('stripe-checkout-form-open', 'form', 1);
    token.attrs = [['method', 'POST'], ['action', '/charges']];

    token = state.push('stripe-checkout-script-open', 'script', 0);
    token.attrs = [
        ['src', 'https://checkout.stripe.com/checkout.js'],
        ['class', 'stripe-button'],
        ['data-key', Discourse.SiteSettings['discourse_donations_public_key']],
        ['data-amount', tagInfo.attrs['amount']],
        ['data-name', Discourse.SiteSettings['discourse_donations_shop_name']],
        ['data-description', content],
        ['data-image', tagInfo.attrs['image'] || ''],
        ['data-locale', 'auto'],
        ['data-zip-code', !Discourse.SiteSettings['discourse_donations_hide_zip_code']],
        ['data-currency', Discourse.SiteSettings['discourse_donations_currency']]
    ];

    state.push('stripe-checkout-script-close', 'script', -1);

    state.push('stripe-checkout-form-close', 'form', -1);
}

function setupMarkdownIt(helper) {
    helper.registerPlugin(md => {
        md.inline.bbcode.ruler.push('stripe-checkout', {
            tag: 'stripe',
            replace: replaceWithStripeOrError
        });
    });
}

export function setup(helper) {
    helper.whiteList([
        'div[class]',
        'form[method]', 'form[action]',
        'script[class]', 'script[src]',
        'script[data-key]',
        'script[data-amount]',
        'script[data-name]',
        'script[data-description]',
        'script[data-image]',
        'script[data-zip-code]',
        'script[data-currency]',
        'script[data-locale]'
    ]);
    if (helper.markdownIt) {
        setupMarkdownIt(helper);
    } else {
        console.log("Please upgrade Discourse to a later version in order to use this plugin");
    }
}