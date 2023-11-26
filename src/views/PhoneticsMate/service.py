import eng_to_ipa as ipa
from flask import Flask, jsonify, request
import json
from flask_cors import CORS
import warnings
warnings.filterwarnings("ignore")

app = Flask(__name__)
CORS(app, supports_credentials=True)


@app.route(['/', '/ping'])
def ping():
    return 'pong'


@app.route('/transcript/ipa', methods=['post'])
def transcript_ipa():
    if not request.data:
        return jsonify({"code": 0, "data": {}})
    student_json = json.loads(request.data)
    data = {}
    for v in student_json:
        data[v] = ipa.convert(v)
    return jsonify({"code": 1, "data": data})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
