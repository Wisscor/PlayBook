FROM python:3.14

WORKDIR /back-end

COPY ./requirements.txt /back-end/requirements.txt
# --no-cache-dir 
RUN pip install --no-cache-dir --upgrade -r /back-end/requirements.txt

COPY ./app /back-end/app

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]