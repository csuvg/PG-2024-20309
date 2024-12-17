module.exports = {  
    extends: [  
        "stylelint-config-standard",  
    ],  
    plugins: [  
    ],  
    rules: {  
        "plugin/declaration-block-no-ignored-properties": true,  
        "declaration-empty-line-before": [  
            "always", {  
            ignore: ["after-comment", "after-declaration", "inside-single-line-block"]  
            }  
        ]  
    },  
    ignoreFiles: [  
        "coverage/**/*.css",  
        "dist/*.css",
        "node_modules/*"
    ]  
}