from flask import Flask
import os

def create_app(test_config=None):
    app = Flask(__name__, 
                static_folder='../static',
                template_folder='../templates')
    
    if test_config is None:
        app.config.from_mapping(
            SECRET_KEY='dev',
            DATABASE=os.path.join(app.instance_path, 'flaskr.sqlite'),
        )
    else:
        app.config.update(test_config)

    from . import routes
    app.register_blueprint(routes.bp)

    return app 